$(function () {
  let headerTop = $(".header__inner");
  let scrollPos = $(window).scrollTop();

  $(window).on("scroll load resize", function () {
    scrollPos = $(this).scrollTop();
    if (scrollPos > 50) {
      headerTop.addClass("header__inner--fixed");
    } else {
      headerTop.removeClass("header__inner--fixed");
    }
  });
});

var mixer = mixitup(".dishes__items");
